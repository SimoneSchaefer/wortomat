import { NOVEL_ITEM_KEYS } from "@/store/keys";

export class DisplaySettingsService {
    private currentSettings: Map<NOVEL_ITEM_KEYS, Map<DisplaySettingsKeys, boolean>>;
    private overrideValues = new Map([
        [NOVEL_ITEM_KEYS.CHAPTERS, new Map([
            [ DisplaySettingsKeys.SHOW_IMAGES, false]
        ])],
        [NOVEL_ITEM_KEYS.CHARACTERS, new Map([
            [ DisplaySettingsKeys.SHOW_TAGS, false],
            [ DisplaySettingsKeys.SHOW_EXTENDED_SUMMARY, false]
        ])],
        [NOVEL_ITEM_KEYS.RESEARCH, new Map([
            [ DisplaySettingsKeys.SHOW_TAGS, false],
            [ DisplaySettingsKeys.SHOW_EXTENDED_SUMMARY, false]
        ])],
        [NOVEL_ITEM_KEYS.LOCATIONS, new Map([
            [ DisplaySettingsKeys.SHOW_TAGS, false],
            [ DisplaySettingsKeys.SHOW_EXTENDED_SUMMARY, false]
        ])],
    ]); 


    public isVisible(novelItemKey: NOVEL_ITEM_KEYS, settingKey: DisplaySettingsKeys): boolean {
        this.initializeIfNecessary();
        return this.currentSettings.get(novelItemKey).get(settingKey) === true;
    }

    private initializeIfNecessary() {
        if (this.currentSettings) {
            return this.currentSettings;
        }
        this.currentSettings = this.initializeWithDefaultValues();
        return this.currentSettings;
    }

    private initializeWithDefaultValues() {
        const allNovelItemKeys = this.getAllEnumValues(NOVEL_ITEM_KEYS);
        const allDisplaySettingKeys = this.getAllEnumValues(DisplaySettingsKeys);

        const defaultAllTrue = new Map();
        allDisplaySettingKeys.forEach((displaySettingKey: string) => {
            defaultAllTrue.set(displaySettingKey, true);    
        });

        const allSettings = new Map();
        allNovelItemKeys.forEach((novelItemKey) => {
            const defaultValues = new Map(defaultAllTrue);
            const actualValues = new Map([
                ...defaultValues.entries(), 
                ...this.overrides(novelItemKey).entries()]);
            allSettings.set(novelItemKey, actualValues);
        })
        return allSettings;
    }

    private overrides(novelItemKey: NOVEL_ITEM_KEYS) {
        return this.overrideValues.get(novelItemKey) || new Map();        
    }

    private getAllEnumValues(enumType) {
        const allValues = [];
        for (const value in enumType) {
            if (isNaN(Number(value))) allValues.push(value)
        }
        return allValues;
    }

}

export class DisplaySettings {
    show_title = true;
    show_summary = true;
    show_extended_summary = true;
    show_tags = true;
    show_image = true;
    show_content = true;
}

export enum DisplaySettingsKeys {
    SHOW_TITLE = 'SHOW_TITLE',
    SHOW_SUMMARY = 'SHOW_SUMMARY',
    SHOW_EXTENDED_SUMMARY = 'SHOW_EXTENDED_SUMMARY',
    SHOW_TAGS = 'SHOW_TAGS',
    SHOW_IMAGES = 'SHOW_IMAGES',
    SHOW_CONTENT = 'SHOW_CONTENT'
}