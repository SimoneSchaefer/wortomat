package de.wortomat.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RouteController {
    @GetMapping("/**/{path:[^\\.]*}")
    public String redirect() {
        return "forward:/";
    }

    @GetMapping("/**/{path:[^/assets/*]*}")
    public String assets() {
        return "forward:/";
    }
}
