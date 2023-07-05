import { Vue } from "vue-class-component";

export default abstract class TodoMarkerAwareMixin extends Vue {
    
    getTodoCount(content: string): number {
        return this.getMarkerCount(content, '#fffc45')
    }  

    getFixmeCount(content: string): number {
        return this.getMarkerCount(content, '#e31f14')
    }

    getIdeaCount(content: string): number {
        return this.getMarkerCount(content, '#5b63f0')
    }

    getMarkerCount(content: string, color: string): number {
        // TODO: make part of model and compute once after loading
        const regex = new RegExp(`data-background-color="${color}"`, 'g');
        const count = ((content || '').match(regex) || []).length;
        return count;
    }
}
  