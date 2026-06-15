package com.talentbridge.onet;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import org.springframework.core.ParameterizedTypeReference;

import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OnetClient {

    private final WebClient webClient;

    public OnetClient(
            @Value("${app.onet.base-url}") String baseUrl,
            @Value("${app.onet.api-key}") String apiKey) {

        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("X-API-Key", apiKey)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Search occupations by keyword. Results cached for 24h.
     */
    @Cacheable(value = "onet-search", key = "#keyword + '-' + #start")
    public OnetSearchResult searchOccupations(String keyword, int start, int end) {
        log.debug("Fetching O*NET search: keyword={}", keyword);
        Map<String, Object> raw = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/mnm/search")
                        .queryParam("keyword", keyword)
                        .queryParam("start", start)
                        .queryParam("end", end)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapSearchResult(raw, start);
    }

    /**
     * Get full occupation details including skills. Cached per O*NET code.
     * Fix #10: details and skills are fetched in parallel via Mono.zip instead of sequentially.
     */
    @Cacheable(value = "onet-occupation", key = "#code")
    public OnetOccupation getOccupation(String code) {
        log.debug("Fetching O*NET occupation: {}", code);

        Mono<Map<String, Object>> detailsMono = webClient.get()
                .uri("/online/occupations/{code}", code)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});

        Mono<Map<String, Object>> skillsMono = webClient.get()
                .uri("/online/occupations/{code}/skills", code)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});

        // Zip subscribes to both Monos concurrently, then combines the results
        return Mono.zip(detailsMono, skillsMono)
                .map(tuple -> OnetResponseMapper.toOccupation(code, tuple.getT1(), tuple.getT2()))
                .block();
    }

    /**
     * List all O*NET occupations with pagination.
     */
    @Cacheable(value = "onet-all", key = "#start")
    public OnetSearchResult listAllOccupations(int start, int end) {
        log.debug("Fetching all O*NET occupations: start={}", start);
        Map<String, Object> raw = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/online/occupations/")
                        .queryParam("start", start)
                        .queryParam("end", end)
                        .build())
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        return mapSearchResult(raw, start);
    }

    /**
     * Browse occupations within a specific career cluster / industry.
     */
    @Cacheable(value = "onet-industry-occs", key = "#industryCode + '-' + #start")
    public OnetSearchResult browseByIndustry(String industryCode, int start, int end) {
        log.debug("Browsing O*NET by industry: code={}", industryCode);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/mnm/careers/{code}")
                        .queryParam("start", start)
                        .queryParam("end", end)
                        .build(industryCode))
                .retrieve()
                .bodyToMono(OnetSearchResult.class)
                .onErrorReturn(new OnetSearchResult(0, start, end, List.of()))
                .block();
    }

    /**
     * List industries / career clusters.
     */
    @Cacheable(value = "onet-industries")
    public List<OnetIndustry> getIndustries() {
        log.debug("Fetching O*NET industries");
        Map<String, Object> response = webClient.get()
                .uri("/mnm/careers")
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        if (response == null || !response.containsKey("career")) {
            return List.of();
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> careers = (List<Map<String, Object>>) response.get("career");
        return careers.stream()
                .map(c -> new OnetIndustry(
                        String.valueOf(c.getOrDefault("code", "")),
                        String.valueOf(c.getOrDefault("title", ""))))
                .toList();
    }

    /**
     * Normalises both /mnm/search ("career" array) and /online/occupations/ ("occupation" array)
     * into a consistent OnetSearchResult.
     */
    @SuppressWarnings("unchecked")
    private OnetSearchResult mapSearchResult(Map<String, Object> raw, int defaultStart) {
        if (raw == null) return new OnetSearchResult(0, defaultStart, defaultStart, List.of());

        int total = toInt(raw.getOrDefault("total", 0));
        int start  = toInt(raw.getOrDefault("start",  defaultStart));
        int end    = toInt(raw.getOrDefault("end",    defaultStart));

        // /mnm/search uses "career"; /online/occupations/ uses "occupation"
        List<Map<String, Object>> items = raw.containsKey("career")
                ? (List<Map<String, Object>>) raw.get("career")
                : raw.containsKey("occupation")
                        ? (List<Map<String, Object>>) raw.get("occupation")
                        : List.of();

        List<OnetSearchResult.OnetOccupationSummary> occupations = items.stream()
                .map(m -> {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> tags = m.get("tags") instanceof Map<?, ?> t
                            ? (Map<String, Object>) t : Map.of();
                    boolean brightOutlook = Boolean.TRUE.equals(tags.get("bright_outlook"));
                    @SuppressWarnings("unchecked")
                    Map<String, Object> zoneMap = m.get("zone") instanceof Map<?, ?> z
                            ? (Map<String, Object>) z : Map.of();
                    String zone = String.valueOf(zoneMap.getOrDefault("title", ""));
                    return new OnetSearchResult.OnetOccupationSummary(
                            String.valueOf(m.getOrDefault("code", "")),
                            String.valueOf(m.getOrDefault("title", "")),
                            brightOutlook,
                            zone);
                })
                .toList();

        return new OnetSearchResult(total, start, end, occupations);
    }

    private int toInt(Object val) {
        if (val instanceof Number n) return n.intValue();
        return 0;
    }
}
