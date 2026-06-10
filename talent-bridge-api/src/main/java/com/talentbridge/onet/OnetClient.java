package com.talentbridge.onet;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import org.springframework.core.ParameterizedTypeReference;

import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class OnetClient {

    private final WebClient webClient;

    public OnetClient(
            @Value("${app.onet.base-url}") String baseUrl,
            @Value("${app.onet.api-key}") String apiKey) {

        String credentials = Base64.getEncoder()
                .encodeToString((apiKey + ":" + apiKey).getBytes()); // O*NET uses API key as both username and password

        this.webClient = WebClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Basic " + credentials)
                .defaultHeader(HttpHeaders.ACCEPT, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Search occupations by keyword. Results cached for 24h.
     */
    @Cacheable(value = "onet-search", key = "#keyword + '-' + #start")
    public OnetSearchResult searchOccupations(String keyword, int start, int end) {
        log.debug("Fetching O*NET search: keyword={}", keyword);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/mnm/search")
                        .queryParam("keyword", keyword)
                        .queryParam("start", start)
                        .queryParam("end", end)
                        .build())
                .retrieve()
                .bodyToMono(OnetSearchResult.class)
                .block();
    }

    /**
     * Get full occupation details including skills. Cached per O*NET code.
     */
    @Cacheable(value = "onet-occupation", key = "#code")
    public OnetOccupation getOccupation(String code) {
        log.debug("Fetching O*NET occupation: {}", code);

        // Fetch details and skills in parallel, then combine
        Map<String, Object> details = webClient.get()
                .uri("/online/occupations/{code}", code)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        Map<String, Object> skillsResponse = webClient.get()
                .uri("/online/occupations/{code}/skills", code)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        return OnetResponseMapper.toOccupation(code, details, skillsResponse);
    }

    /**
     * List all O*NET occupations with pagination.
     */
    @Cacheable(value = "onet-all", key = "#start")
    public OnetSearchResult listAllOccupations(int start, int end) {
        log.debug("Fetching all O*NET occupations: start={}", start);
        return webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/online/occupations/")
                        .queryParam("start", start)
                        .queryParam("end", end)
                        .build())
                .retrieve()
                .bodyToMono(OnetSearchResult.class)
                .block();
    }

    /**
     * Browse occupations within a specific career cluster / industry.
     * Uses the MNM "fit" pathway by keyword-searching the cluster title.
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
}
