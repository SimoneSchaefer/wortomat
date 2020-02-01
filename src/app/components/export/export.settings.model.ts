import { ExportFormat } from "./export.component";

export class ExportSettings {
    title: string = "";
    subtitle: string = "";
    author: string = "";
    isbn: string ="";
    pageHeight: number = 8.5;
    pageWidth: number = 5.675;
    marginInner: number = 1.222;
    marginOuter: number = 0.611;
    marginTop : number = 0.722;
    marginBottom: number = 1.545;
    include: string[] = ['title', 'content'];
    format: ExportFormat = ExportFormat.HTML;
}