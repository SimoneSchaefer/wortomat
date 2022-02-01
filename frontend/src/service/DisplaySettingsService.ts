import { DisplaySettingsKeys, NOVEL_ITEM_KEYS } from "@/store/keys";

export class DisplaySettingsService {
    readonly LOCAL_STORAGE_KEY = 'WORTOMAT_DISPLAY_SETTINGS';

    public isVisible(novelItemKey: NOVEL_ITEM_KEYS, settingKey: DisplaySettingsKeys): boolean {
        return this.currentSettings[novelItemKey][settingKey] === true;
    }

    public setVisible(novelItemKey: NOVEL_ITEM_KEYS, settingKey: DisplaySettingsKeys, visible: boolean) {
        console.log('updating visiblity');
        const currentSettings = this.currentSettings;
        currentSettings[novelItemKey][settingKey] = visible;
        this.storeSettings(currentSettings);
        return currentSettings;
    }

    private storeSettings(values: Record<NOVEL_ITEM_KEYS, Record<DisplaySettingsKeys, boolean>>) {
        localStorage.setItem('WORTOMAT_DISPLAY_SETTINGS', JSON.stringify(values));
    }

    get currentSettings(): Record<NOVEL_ITEM_KEYS, Record<DisplaySettingsKeys, boolean>> {
        const inLocalStorage = localStorage.getItem('WORTOMAT_DISPLAY_SETTINGS');
        if (!inLocalStorage) {
            this.storeSettings(this.initializeWithDefaultValues());
            localStorage.setItem('WORTOMAT_DISPLAY_SETTINGS', JSON.stringify(this.initializeWithDefaultValues()));
        }
        console.log('getting current settings');
        return JSON.parse(localStorage.getItem('WORTOMAT_DISPLAY_SETTINGS'));    
    }


    initializeWithDefaultValues(): Record<NOVEL_ITEM_KEYS, Record<DisplaySettingsKeys, boolean>>  {
        const allNovelItemKeys = this.getAllEnumValues(NOVEL_ITEM_KEYS);
        const allDisplaySettingKeys = this.getAllEnumValues(DisplaySettingsKeys);

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
