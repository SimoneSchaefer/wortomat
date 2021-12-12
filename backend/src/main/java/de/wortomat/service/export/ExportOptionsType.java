package de.wortomat.service.export;

public enum ExportOptionsType {
        HTML("html"),
        PDF("pdf"),
        WORD("doc"),
        PDF_LATEX("pdf");


        private final String fileEnding;
        ExportOptionsType(final String fileEnding) {
                this.fileEnding = fileEnding;
        }

        public String getFileEnding() {
              return this.fileEnding;
        }

}
