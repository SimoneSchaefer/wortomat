import Novel from "@/models/Novel.model";

export const state = {
    novels: [],
    openNovel: Novel
}

export type State = typeof state