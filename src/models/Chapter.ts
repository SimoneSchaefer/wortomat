import BaseModel from "./Base";

export default class Chapter extends BaseModel {
    public title: string;
    public summary: string;
    public extended_summary: string;
    public content: string;   

}