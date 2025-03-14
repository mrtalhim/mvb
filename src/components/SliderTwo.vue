<template>
    <div class="slider-container">
        <input type="range" :min="min" :max="max" :step="step" v-model.number="currentValue" class="slider"
            @input="handleInput" />
        <input type="number" :min="min" :max="max" :step="step" v-model.number="currentValue" class="number-input"
            @input="handleInput" />
        <!-- <div class="value-display">{{ currentValue }}</div> -->
    </div>
</template>

<script>
export default {
    name: 'SliderComponent',
    props: {
        min: {
            type: Number,
            default: 0,
        },
        max: {
            type: Number,
            default: 100,
        },
        step: {
            type: Number,
            default: 1,
        },
        modelValue: {
            type: Number,
            default: 0,
        },
    },
    data() {
        return {
            currentValue: this.modelValue,
        };
    },
    watch: {
        currentValue: {
            immediate: true,
            handler: 'emitUpdate'
        },
        currentValue(newValue) {
            this.$emit('update:modelValue', newValue);
        },
        modelValue(newValue) {
            this.currentValue = parseInt(newValue)
        }
    },
    methods: {
        handleInput() {
            this.emitUpdate(this.currentValue);
        },
        emitUpdate(value) {
            this.$emit('update:modelValue', value);
        }
    }
};
</script>

<style scoped>
.slider-container {
    display: flex;
    align-items: center;
    gap: 10px;
}

.slider {
    -webkit-appearance: none;
    width: 200px;
    height: 10px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: 0.2s;
    transition: opacity 0.2s;
    border-radius: 5px;
}

.slider:hover {
    opacity: 1;
}

.slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #04aa6d;
    cursor: pointer;
    border-radius: 50%;
}

.slider::-moz-range-thumb {
    width: 20
}

.number-input {
    width: 60px;
    padding: 5px;
    border: 1px solid #ccc;
    border-radius: 4px;
    text-align: center;
}

.value-display {
    font-size: 1rem;
    font-weight: bold;
    color: #333;
}
</style>
