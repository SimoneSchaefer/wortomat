import { BaseModel } from "@/models/Base.model";
import { Vue } from "vue-class-component";


export default abstract class TranslatableNovelItemMixin extends Vue {
    abstract get item(): any;
    get translatedName() {
        if (this.item.containsTranslation) {
            return this.$t(this.item.name);
        }
        return this.item.name;
    }    
    
    get translatedSummary() {
        if (this.item.containsTranslation) {
            return this.$t(this.item.summary);
        }
        return this.item.summary;
    } 
    
    get translatedContent() {
        if (this.item.containsTranslation) {
            return this.$t(this.item.content);
        }
        return this.item.content;
    }
}
