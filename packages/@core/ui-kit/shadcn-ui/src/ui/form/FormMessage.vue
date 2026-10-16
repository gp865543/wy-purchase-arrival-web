<script lang="ts" setup>
import { toValue } from 'vue';

import { ErrorMessage } from 'vee-validate';

import { useFormField } from './useFormField';

const { formMessageId, name } = useFormField();
</script>

<template>
  <ErrorMessage
    v-slot="{ message }"
    :id="formMessageId"
    :name="toValue(name)"
    as="p"
    class="text-destructive text-[0.8rem]"
  >
    <slot :message="message">{{ message }}</slot>
  </ErrorMessage>
</template>
