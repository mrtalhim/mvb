<template>
    <div class="w-full relative">
        <div class="flex">
            <div v-for="value in range" :key="value"
                class="grow p-2 cursor-pointer transition-all transition-discrete duration-200 ease-in-out text-center rounded-none"
                :class="[
                    value !== selectedValue ? 'bg-gray-300' : 'bg-blue-500 shadow-md',
                    value === min ? 'rounded-l-2xl' : '',
                    value === max ? 'rounded-r-2xl' : '',
                ]" @click="selectValue(value)">
                <p>{{ value }}</p>
                <div v-if="selectedValue == value" class="transition-discrete">{{ label }}</div>
            </div>
        </div>
    </div>
</template>

<script>
import { watch } from 'vue';

export default {
    props: {
        min: {
            type: Number,
            required: true,
        },
        max: {
            type: Number,
            required: true,
        },
        step: {
            type: Number,
            default: 1,
        },
        label: {
            type: String,
            default: '',
        },
        modelValue: {
            type: Number,
            default: null,
        },
    },
    data() {
        return {
            selectedValue: this.modelValue,
        };
    },
    computed: {
        range() {
            const result = [];
            for (let i = this.min; i <= this.max; i += this.step) {
                result.push(i);
            }
            return result;
        },
    },
    methods: {
        selectValue(value) {
            this.selectedValue = value;
            this.$emit('update:modelValue', value); // Emit update:modelValue
        },
    },
    watch: {
        modelValue(newVal) {
            this.selectedValue = newVal
        }
    }
};
</script>
