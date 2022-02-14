import { Vue } from "vue-class-component";

export default abstract class TodoMarkerAwareMixin extends Vue {
    
    getTodoCount(content: string): number {
        return this.getMarkerCount(content, 'yellow')
    }  

    getFixmeCount(content: string): number {
        return this.getMarkerCount(content, 'red')
    }

    getIdeaCount(content: string): number {
        return this.getMarkerCount(content, 'blue')
    }

    getMarkerCount(content: string, color: string): number {
        // TODO: make part of model and compute once after loading
        const regex = new RegExp(`data-background-color="${color}"`, 'g');
        const count = ((content || '').match(regex) || []).length;
        return count;
    }
}
  