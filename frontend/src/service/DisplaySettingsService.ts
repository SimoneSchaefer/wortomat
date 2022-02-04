import { DISPLAY_SETTINGS_KEYS, NOVEL_ITEM_KEYS, PARENT_ITEM_KEYS } from "@/store/keys";

export class DisplaySettingsService {
    readonly LOCAL_STORAGE_KEY = 'WORTOMAT_DISPLAY_SETTINGS';

    public isVisible(novelItemKey: PARENT_ITEM_KEYS, settingKey: DISPLAY_SETTINGS_KEYS): boolean {
        return this.currentSettings[novelItemKey][settingKey] === true;
    }

    public setVisible(novelItemKey: PARENT_ITEM_KEYS, settingKey: DISPLAY_SETTINGS_KEYS, visible: boolean) {
        const currentSettings = this.currentSettings;
        currentSettings[novelItemKey][settingKey] = visible;
        this.storeSettings(currentSettings);
        return currentSettings;
    }

    private storeSettings(values: Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>) {
        localStorage.setItem('WORTOMAT_DISPLAY_SETTINGS', JSON.stringify(values));
    }

    get currentSettings(): Record<PARENT_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>> {
        const inLocalStorage = localStorage.getItem('WORTOMAT_DISPLAY_SETTINGS');
        if (!inLocalStorage) {
            this.storeSettings(this.initializeWithDefaultValues());
            localStorage.setItem('WORTOMAT_DISPLAY_SETTINGS', JSON.stringify(this.initializeWithDefaultValues()));
        }
        return JSON.parse(localStorage.getItem('WORTOMAT_DISPLAY_SETTINGS'));    
    }


    initializeWithDefaultValues(): Record<NOVEL_ITEM_KEYS, Record<DISPLAY_SETTINGS_KEYS, boolean>>  {
        const allNovelItemKeys = this.getAllEnumValues(NOVEL_ITEM_KEYS);
        const allDisplaySettingKeys = this.getAllEnumValues(DISPLAY_SETTINGS_KEYS);

        const defaultAllTrue = {};
        allDisplaySettingKeys.forEach((displaySettingKey: string) => {
            defaultAllTrue[displaySettingKey] = true;    
        });

        const allSettings: Record<string, Record<string, boolean>> = {};
        allNovelItemKeys.forEach((novelItemKey) => {
            const defaultValues = Object.assign({}, defaultAllTrue);
            allSettings[novelItemKey] = defaultValues;
        })
        return allSettings;
    }

    getAllEnumValues(enumType) {
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
