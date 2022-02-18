package de.wortomat.service.export;

public enum ExportOptionsFormat {
        HTML("html"),
        PDF("pdf"),
        WORD("doc"),
        PDF_LATEX("pdf");


        private final String fileEnding;
        ExportOptionsFormat(final String fileEnding) {
                this.fileEnding = fileEnding;
        }

        public String getFileEnding() {
              return this.fileEnding;
        }

}
