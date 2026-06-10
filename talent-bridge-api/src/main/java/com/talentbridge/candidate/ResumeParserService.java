package com.talentbridge.candidate;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.tika.Tika;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResumeParserService {

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;
    private final Tika tika = new Tika();

    private static final String SYSTEM_PROMPT = """
            You are an expert resume parser. Extract structured information from the provided resume text.
            Return ONLY valid JSON matching this exact schema — no markdown, no explanation:
            {
              "headline": "string (e.g. 'Senior Software Engineer')",
              "summary": "string (2-3 sentence professional summary)",
              "skills": [
                { "name": "string", "category": "string (e.g. Language, Framework, Cloud, Tool)", "yearsExperience": number_or_null, "proficiency": "BEGINNER|INTERMEDIATE|ADVANCED|EXPERT" }
              ],
              "experiences": [
                { "title": "string", "company": "string", "startDate": "YYYY-MM", "endDate": "YYYY-MM or null", "description": "string", "current": boolean }
              ],
              "educations": [
                { "degree": "string", "field": "string", "institution": "string", "year": number_or_null }
              ],
              "certifications": [
                { "name": "string", "issuer": "string", "year": number_or_null }
              ]
            }
            """;

    public ParsedResume parse(MultipartFile file) {
        try {
            // Extract raw text from PDF/DOCX using Apache Tika
            String resumeText = tika.parseToString(file.getInputStream());
            log.debug("Extracted {} chars from resume", resumeText.length());

            // Send to Claude for structured extraction
            String json = chatClient.prompt()
                    .system(SYSTEM_PROMPT)
                    .user("Parse this resume:\n\n" + resumeText)
                    .call()
                    .content();

            return objectMapper.readValue(json, ParsedResume.class);

        } catch (Exception e) {
            log.error("Failed to parse resume", e);
            throw new RuntimeException("Resume parsing failed: " + e.getMessage(), e);
        }
    }
}
