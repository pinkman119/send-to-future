import { ref } from 'vue'

const toasts = ref([])
let seq = 0

export function useToast() {
  function toast(message, type = 'info') {
    const id = ++seq
    toasts.value.push({ id, message, type })
    setTimeout(() => remove(id), 2800)
  }

  function remove(id) {
    const idx = toasts.value.findIndex((t) => t.id === id)
    if (idx > -1) toasts.value.splice(idx, 1)
  }

  return { toasts, toast, remove }
}
