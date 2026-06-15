package com.talentbridge.onet;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/onet")
@RequiredArgsConstructor
public class OnetController {

    private final OnetClient onetClient;

    /** List ALL O*NET occupations (paginated). */
    @GetMapping("/occupations")
    public ResponseEntity<OnetSearchResult> listAll(
            @RequestParam(defaultValue = "1") int start,
            @RequestParam(defaultValue = "20") int end) {
        return ResponseEntity.ok(onetClient.listAllOccupations(start, end));
    }

    @GetMapping("/occupations/search")
    public ResponseEntity<OnetSearchResult> search(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int start,
            @RequestParam(defaultValue = "20") int end) {
        return ResponseEntity.ok(onetClient.searchOccupations(keyword, start, end));
    }

    @GetMapping("/occupations/{code}")
    public ResponseEntity<OnetOccupation> getOccupation(@PathVariable String code) {
        return ResponseEntity.ok(onetClient.getOccupation(code));
    }

    /** Browse occupations within a specific career cluster. */
    @GetMapping("/occupations/industry/{industryCode}")
    public ResponseEntity<OnetSearchResult> browseByIndustry(
            @PathVariable String industryCode,
            @RequestParam(defaultValue = "1") int start,
            @RequestParam(defaultValue = "20") int end) {
        return ResponseEntity.ok(onetClient.browseByIndustry(industryCode, start, end));
    }

    @GetMapping("/industries")
    public ResponseEntity<?> getIndustries() {
        return ResponseEntity.ok(onetClient.getIndustries());
    }
}
