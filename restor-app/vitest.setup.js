import { vi } from 'vitest'
import { defineComponent } from 'vue'

const { mockToastCreate } = vi.hoisted(() => ({
  mockToastCreate: vi.fn(),
}))

export { mockToastCreate }

vi.mock('bootstrap-vue-next', () => ({
  useToast: () => ({ create: mockToastCreate }),

  BPopover: defineComponent({
    name: 'BPopover',
    props: ['placement', 'manual'],
    template: '<div class="b-popover-stub"><slot name="target" /></div>',
  }),

  BModal: defineComponent({
    name: 'BModal',
    props: {
      modelValue: { type: Boolean, default: false },
      title: { type: String, default: '' },
      centered: { type: Boolean, default: false },
    },
    emits: ['update:modelValue', 'hide', 'close'],
    template: `
      <div v-if="modelValue" data-testid="b-modal" role="dialog">
        <h2 class="modal-title">{{ title }}</h2>
        <slot />
        <slot name="footer" />
      </div>
    `,
  }),

  BListGroup: defineComponent({
    name: 'BListGroup',
    template: '<div class="list-group" data-testid="b-list-group"><slot /></div>',
  }),

  BListGroupItem: defineComponent({
    name: 'BListGroupItem',
    props: {
      disabled: { type: Boolean, default: false },
      button: { type: Boolean, default: false },
    },
    emits: ['click'],
    template:
      '<button type="button" class="list-group-item" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  }),

  BButton: defineComponent({
    name: 'BButton',
    inheritAttrs: false,
    props: {
      disabled: { type: Boolean, default: false },
      variant: String,
      size: String,
      loading: { type: Boolean, default: false },
      loadingText: String,
      title: String,
    },
    emits: ['click'],
    template:
      '<button type="button" v-bind="$attrs" :disabled="disabled || loading" :title="title" :data-loading="loading ? \'true\' : undefined" @click="$emit(\'click\', $event)"><slot /></button>',
  }),

  BNavbar: defineComponent({
    name: 'BNavbar',
    inheritAttrs: false,
    template: '<nav><slot /></nav>',
  }),

  BNavbarBrand: defineComponent({
    name: 'BNavbarBrand',
    inheritAttrs: false,
    template: '<div><slot /></div>',
  }),

  BNavbarNav: defineComponent({
    name: 'BNavbarNav',
    inheritAttrs: false,
    template: '<div><slot /></div>',
  }),

  BNavbarToggle: defineComponent({
    name: 'BNavbarToggle',
    inheritAttrs: false,
    template: '<button type="button"><slot /></button>',
  }),

  BCollapse: defineComponent({
    name: 'BCollapse',
    inheritAttrs: false,
    template: '<div><slot /></div>',
  }),

  BNavItem: defineComponent({
    name: 'BNavItem',
    inheritAttrs: false,
    props: ['to'],
    template: '<div><slot /></div>',
  }),

  BNavText: defineComponent({
    name: 'BNavText',
    inheritAttrs: false,
    template: '<div><slot /></div>',
  }),

  vBColorMode: vi.fn(),

  BCard: defineComponent({
    name: 'BCard',
    props: { noBody: Boolean },
    template: '<div class="b-card-stub" data-testid="b-card"><slot /></div>',
  }),

  BCardBody: defineComponent({
    name: 'BCardBody',
    template: '<div class="card-body" data-testid="b-card-body"><slot /></div>',
  }),

  BCardImg: defineComponent({
    name: 'BCardImg',
    props: { src: String, alt: String, imgTop: Boolean },
    template:
      '<img v-if="src" :src="src" :alt="alt || \'\'" class="card-img" data-testid="b-card-img" />',
  }),

  BBadge: defineComponent({
    name: 'BBadge',
    props: ['variant'],
    template: '<span class="badge"><slot /></span>',
  }),

  BSpinner: defineComponent({
    name: 'BSpinner',
    props: { small: Boolean },
    template: '<span class="spinner-border-sm" data-testid="b-spinner"></span>',
  }),

  BRow: defineComponent({
    name: 'BRow',
    template: '<div class="row" data-testid="b-row"><slot /></div>',
  }),

  BCol: defineComponent({
    name: 'BCol',
    props: { cols: [String, Number] },
    template: '<div class="col" data-testid="b-col"><slot /></div>',
  }),

  BImg: defineComponent({
    name: 'BImg',
    props: {
      src: String,
      alt: String,
      width: [String, Number],
      height: [String, Number],
      rounded: Boolean,
      fluid: Boolean,
    },
    template:
      '<img :src="src" :alt="alt" :width="width" :height="height" class="b-img-stub" data-testid="b-img" />',
  }),

  BPagination: defineComponent({
    name: 'BPagination',
    props: {
      modelValue: { type: Number, default: 1 },
      totalRows: { type: Number, default: 0 },
      perPage: { type: Number, default: 10 },
    },
    emits: ['update:modelValue'],
    template: '<nav data-testid="b-pagination" class="pagination" aria-label="Pagination" />',
  }),

  BFormInput: defineComponent({
    name: 'BFormInput',
    inheritAttrs: false,
    props: {
      modelValue: [String, Number],
      type: { type: String, default: 'text' },
      placeholder: String,
      id: String,
      size: String,
      required: Boolean,
      state: [Boolean, null],
    },
    emits: ['update:modelValue', 'keyup'],
    template:
      '<input :id="id" :type="type" :value="modelValue" :placeholder="placeholder" data-testid="b-form-input" @input="$emit(\'update:modelValue\', $event.target.value)" @keyup.enter="$emit(\'keyup\', $event)" />',
  }),

  BInputGroup: defineComponent({
    name: 'BInputGroup',
    template: '<div class="input-group" data-testid="b-input-group"><slot /></div>',
  }),

  BFormSelect: defineComponent({
    name: 'BFormSelect',
    props: {
      modelValue: [String, Number, null],
      options: { type: Array, default: () => [] },
      valueField: { type: String, default: 'value' },
      textField: { type: String, default: 'text' },
      id: String,
      state: [Boolean, null],
    },
    emits: ['update:modelValue'],
    template:
      '<select :id="id" data-testid="b-form-select" @change="onChange"><option v-for="(opt, i) in options" :key="i" :value="opt[valueField] === null || opt[valueField] === undefined ? \'\' : String(opt[valueField])">{{ opt[textField] }}</option></select>',
    methods: {
      onChange(e) {
        const raw = e.target.value
        if (raw === '') this.$emit('update:modelValue', null)
        else {
          const n = Number(raw)
          this.$emit('update:modelValue', Number.isNaN(n) ? raw : n)
        }
      },
    },
  }),

  BFormTextarea: defineComponent({
    name: 'BFormTextarea',
    props: {
      modelValue: String,
      id: String,
      rows: [String, Number],
      placeholder: String,
    },
    emits: ['update:modelValue'],
    template:
      '<textarea :id="id" :rows="rows" :placeholder="placeholder" data-testid="b-form-textarea" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  }),

  BFormGroup: defineComponent({
    name: 'BFormGroup',
    props: { label: String, labelFor: String },
    template:
      '<div class="mb-3" data-testid="b-form-group"><label v-if="label" :for="labelFor">{{ label }}</label><slot /></div>',
  }),

  BAlert: defineComponent({
    name: 'BAlert',
    props: { variant: String, show: Boolean },
    template: '<div class="alert" data-testid="b-alert" role="alert"><slot /></div>',
  }),

  BFormInvalidFeedback: defineComponent({
    name: 'BFormInvalidFeedback',
    props: { id: String },
    template: '<div :id="id" class="invalid-feedback"><slot /></div>',
  }),
}))
