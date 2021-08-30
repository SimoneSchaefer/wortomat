package de.wortomat.service.export;

import java.io.IOException;

public interface Exporter {
    void export(Long novelId, ExportOptions exportOptions, String filePath ) throws IOException;
}

