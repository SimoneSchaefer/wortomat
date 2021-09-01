package de.wortomat.service.export;

import com.itextpdf.text.Document;
import com.itextpdf.text.DocumentException;
import com.itextpdf.text.pdf.PdfWriter;
import com.itextpdf.tool.xml.XMLWorkerHelper;
import org.apache.tomcat.util.http.fileupload.IOUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.charset.StandardCharsets;


@Service
public class PDFExportService implements Exporter {
    @Autowired
    private HTMLExportService htmlExportService;

    @Override
    public void export(Long novelId, ExportOptions exportOptions, String filePath) throws IOException {
        try {
            Document document = new Document();
            PdfWriter writer = PdfWriter.getInstance(document, new FileOutputStream(filePath));
            document.open();
            XMLWorkerHelper.getInstance().parseXHtml(
                    writer,
                    document,
                    new ByteArrayInputStream(htmlExportService.generateHTML(novelId, exportOptions).getBytes(StandardCharsets.UTF_8)));
            document.close();
        } catch (DocumentException e) {
            throw new IOException(e);
        }
    }
}
