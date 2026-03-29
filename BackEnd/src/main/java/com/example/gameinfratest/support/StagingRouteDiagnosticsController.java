package com.example.gameinfratest.support;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.RequestMappingInfo;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@Profile("staging")
@RestController
@RequestMapping("/api/public/debug")
public class StagingRouteDiagnosticsController {
    private static final Logger log = LoggerFactory.getLogger(StagingRouteDiagnosticsController.class);

    private final RequestMappingHandlerMapping handlerMapping;

    public StagingRouteDiagnosticsController(RequestMappingHandlerMapping handlerMapping) {
        this.handlerMapping = handlerMapping;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void logRelevantRoutes() {
        Map<String, List<String>> routes = collectRelevantRoutes();
        routes.forEach((controller, patterns) ->
                log.info("staging route diagnostics controller={} routes={}", controller, patterns)
        );
    }

    @GetMapping("/routes")
    public Map<String, Object> routes() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("controllers", collectRelevantRoutes());
        return body;
    }

    private Map<String, List<String>> collectRelevantRoutes() {
        return handlerMapping.getHandlerMethods().entrySet().stream()
                .filter(entry -> isRelevant(entry.getValue()))
                .sorted(Comparator.comparing(entry -> entry.getValue().getBeanType().getSimpleName()))
                .collect(Collectors.groupingBy(
                        entry -> entry.getValue().getBeanType().getSimpleName(),
                        LinkedHashMap::new,
                        Collectors.mapping(this::describeRoute, Collectors.toList())
                ));
    }

    private boolean isRelevant(HandlerMethod handlerMethod) {
        String simpleName = handlerMethod.getBeanType().getSimpleName();
        return simpleName.equals("SaveFileController")
                || simpleName.equals("ChallengeController")
                || simpleName.equals("AssetBundleController")
                || simpleName.equals("AuthController");
    }

    private String describeRoute(Map.Entry<RequestMappingInfo, HandlerMethod> entry) {
        RequestMappingInfo info = entry.getKey();
        String methods = info.getMethodsCondition().getMethods().isEmpty()
                ? "[ALL]"
                : info.getMethodsCondition().getMethods().toString();
        String patterns = info.getPathPatternsCondition() == null
                ? String.valueOf(info.getPatternsCondition())
                : info.getPathPatternsCondition().getPatternValues().toString();
        return methods + " " + patterns;
    }
}
