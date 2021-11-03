<template>
    <div class="spinner" v-if="isLoading()">
        <div class="loader">
            <div class="lds-heart"><div></div></div>
        </div>
    </div> 
</template>    

<script lang="ts">
import { Options, Vue } from "vue-class-component";

@Options({})
export default class Spinner extends Vue {
    isLoading(): boolean {
        return this.$store.state.loading;
    }
}
</script>

<style scoped>
.spinner {
  position: fixed;
  pointer-events: none;
  z-index: 999;
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-content: center;
  align-items: center;
  background: var(--dark-background);
}

.spinner > * {
    pointer-events: none;
}

      .loader {
        display: flex;
        height: 100vh;
        width: 100vw;
        justify-content: center;
        align-items: center;
        align-content: center;  
        background: var(--dark-background);

      }
      .lds-heart {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
        transform: rotate(45deg);
        transform-origin: 40px 40px;
      }
      .lds-heart div {
        top: 32px;
        left: 32px;
        position: absolute;
        width: 32px;
        height: 32px;
        background: #dfc;
        animation: lds-heart 1.2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
      }
      .lds-heart div:after,
      .lds-heart div:before {
        content: " ";
        position: absolute;
        display: block;
        width: 32px;
        height: 32px;
        background: #dfc;
      }
      .lds-heart div:before {
        left: -24px;
        border-radius: 50% 0 0 50%;
      }
      .lds-heart div:after {
        top: -24px;
        border-radius: 50% 50% 0 0;
      }
      @keyframes lds-heart {
        0% {
          transform: scale(0.95);
        }
        5% {
          transform: scale(1.1);
        }
        39% {
          transform: scale(0.85);
        }
        45% {
          transform: scale(1);
        }
        60% {
          transform: scale(0.95);
        }
        100% {
          transform: scale(0.9);
        }
      }
</style>