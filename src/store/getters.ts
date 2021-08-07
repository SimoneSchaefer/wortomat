import { getCurrentSelection, SELECTION_KEYS } from "./store.helper";

export class getters {
    openNovelId(state) {
      return state.currentNovel?.id
    }
    currentChapters(state) {
      return getCurrentSelection(state, SELECTION_KEYS.CHAPTERS);      
    }
}