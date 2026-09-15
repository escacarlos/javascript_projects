<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  BContainer,
  BRow,
  BCol,
  BCard,
  BCardBody,
  BForm,
  BFormGroup,
  BFormInput,
  BButton,
  BTabs,
  BTab,
  useToast,
} from 'bootstrap-vue-next'
import { login as loginService, signup as signupService } from '@/services/authService'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// Tabs
const activeTab = ref('login')

// Login form state
const loginEmail = ref('')
const loginPassword = ref('')
const loginSubmitting = ref(false)

// Signup form state
const signupName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const signupSubmitting = ref(false)

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

onMounted(() => {
  if (route.query.expired === '1') {
    toast.create({
      title: 'Your session has expired. Please log in again.',
      variant: 'warning',
      autoHideDelay: 4000,
    })
    const nextQuery = { ...route.query }
    delete nextQuery.expired
    router.replace({
      name: 'Login',
      query: Object.keys(nextQuery).length ? nextQuery : undefined,
    })
  }
})

async function handleLogin() {
  if (!loginEmail.value || !loginPassword.value) {
    toast.create({
      title: 'Email and password are required.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }
  if (!validateEmail(loginEmail.value)) {
    toast.create({
      title: 'Please enter a valid email address.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }

  loginSubmitting.value = true
  await loginService(loginEmail.value, loginPassword.value)
    .then(() => {
      router.push({ name: 'Home' })
    })
    .catch((err) => {
      if (err && err.status === 401) {
        toast.create({
          title: 'Invalid email or password. Please try again.',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      } else {
        toast.create({
          title: 'An error occurred while logging in. Please try again later.',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      }
    })
    .finally(() => {
      loginSubmitting.value = false
    })
}

async function handleSignup() {
  if (!signupName.value || !signupEmail.value || !signupPassword.value) {
    toast.create({
      title: 'Name, email and password are required.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }
  if (!validateEmail(signupEmail.value)) {
    toast.create({
      title: 'Please enter a valid email address.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }
  if (signupPassword.value.length < 6) {
    toast.create({
      title: 'Password must be at least 6 characters long.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    return
  }

  signupSubmitting.value = true
  await signupService(signupName.value, signupEmail.value, signupPassword.value)
    .then(() => {
      toast.create({
        title: 'Account created successfully. You can now log in.',
        variant: 'success',
        autoHideDelay: 3000,
      })
      activeTab.value = 'login'
      loginEmail.value = signupEmail.value
      signupEmail.value = ''
      signupName.value = ''
      signupPassword.value = ''
    })
    .catch((err) => {
      if (err && err.status === 400) {
        toast.create({
          title: 'Unable to create account. Please check your information.',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      } else {
        toast.create({
          title: 'An error occurred while creating your account. Please try again later.',
          variant: 'danger',
          autoHideDelay: 3000,
        })
      }
    })
    .finally(() => {
      signupSubmitting.value = false
    })
}
</script>

<template>
  <BContainer class="py-5">
    <BRow class="justify-content-center">
      <BCol cols="12" md="8" lg="6">
        <BCard class="shadow-sm border-0">
          <BCardBody>
            <h1 class="h3 mb-4 text-center">
              <i class="bi bi-person-circle me-2"></i>
              Authentication
            </h1>

            <BTabs v-model="activeTab" justified>
              <BTab title="Login" :tab="`login`" value="login" active>
                <BForm @submit.prevent="handleLogin" class="mt-3">
                  <BFormGroup label="Email" label-for="login-email" class="mb-3">
                    <BFormInput
                      id="login-email"
                      v-model="loginEmail"
                      type="email"
                      autocomplete="email"
                      required
                      placeholder="you@example.com"
                    />
                  </BFormGroup>
                  <BFormGroup label="Password" label-for="login-password" class="mb-4">
                    <BFormInput
                      id="login-password"
                      v-model="loginPassword"
                      type="password"
                      autocomplete="current-password"
                      required
                      placeholder="Your password"
                    />
                  </BFormGroup>
                  <div class="d-grid">
                    <BButton
                      type="submit"
                      variant="primary"
                      :disabled="loginSubmitting"
                      :loading="loginSubmitting"
                      loading-text="Logging in..."
                    >
                      Log in
                    </BButton>
                  </div>
                </BForm>
              </BTab>

              <BTab title="Sign up" :tab="`signup`" value="signup">
                <BForm @submit.prevent="handleSignup" class="mt-3">
                  <BFormGroup label="Name" label-for="signup-name" class="mb-3">
                    <BFormInput
                      id="signup-name"
                      v-model="signupName"
                      type="text"
                      required
                      placeholder="Your name"
                    />
                  </BFormGroup>
                  <BFormGroup label="Email" label-for="signup-email" class="mb-3">
                    <BFormInput
                      id="signup-email"
                      v-model="signupEmail"
                      type="email"
                      autocomplete="email"
                      required
                      placeholder="you@example.com"
                    />
                  </BFormGroup>
                  <BFormGroup label="Password" label-for="signup-password" class="mb-4">
                    <BFormInput
                      id="signup-password"
                      v-model="signupPassword"
                      type="password"
                      autocomplete="new-password"
                      required
                      placeholder="Choose a strong password"
                    />
                  </BFormGroup>
                  <div class="d-grid">
                    <BButton
                      type="submit"
                      variant="success"
                      :disabled="signupSubmitting"
                      :loading="signupSubmitting"
                      loading-text="Creating account..."
                    >
                      Create account
                    </BButton>
                  </div>
                </BForm>
              </BTab>
            </BTabs>
          </BCardBody>
        </BCard>
      </BCol>
    </BRow>
  </BContainer>
</template>
