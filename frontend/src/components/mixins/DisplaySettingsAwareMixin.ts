import { DISPLAY_SETTINGS_KEYS } from "@/store/keys"
import { Vue } from "vue-class-component";

export default abstract class DisplaySettingsAwareMixin extends Vue {
 
    get displayImages() {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_IMAGES);
    }
    get displayTitle(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_TITLE);
    }
    get displaySummary(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_SUMMARY);
    }
    get displayExtendedSummary(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_EXTENDED_SUMMARY);
    }
    get displayContent(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_CONTENT);
    }
    get displayTags(): boolean {
        return this.isEnabled(DISPLAY_SETTINGS_KEYS.SHOW_TAGS);
    }
    private isEnabled(view: DISPLAY_SETTINGS_KEYS): boolean {
        return this.$store.state.displaySettings[this.$store.state.activeParentKey][view];
     }
  }
  