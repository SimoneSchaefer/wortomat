package de.wortomat.controller;

import de.wortomat.model.Setting;
import de.wortomat.service.export.PandocService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/settings/")
@CrossOrigin
public class SettingController {
    @Autowired
    PandocService pandocService;

    @GetMapping
    public ResponseEntity<Setting> settings() throws IOException {
        Setting setting = new Setting();
        setting.setPandocInstalled(pandocService.isPandocInstalled());
        return ResponseEntity.ok(setting);
    }


}
