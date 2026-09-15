<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { BCard, BCardBody, BForm, BFormInput, BFormGroup, BButton, BRow, BCol, useToast } from 'bootstrap-vue-next'
import { login, createUser } from '../services/userService.js'
import { store } from '../store/store.js'

const router = useRouter()
const isLogin = ref(true)
const { create } = useToast()

// Login
const username = ref('')
const errorMessage = ref('')
const password = ref('')

// Register
const regUsername = ref('')
const regErrorMessage = ref('')
const regPassword = ref('')

const loadingLogin = ref(false)
const loadingRegister = ref(false)

async function onSubmit() {
  errorMessage.value = ''
  if (!username.value.trim()) {
    errorMessage.value = 'Please enter your username.'
    return
  } else if (!password.value.trim()) {
    errorMessage.value = 'Please enter your password.'
    return
  }

  loadingLogin.value = true

  try {
    await login(username.value, password.value)
    router.push({ name: 'board' })
  } catch (error) {
    errorMessage.value = error.body?.errors?.message || 'Login failed'
  } finally {
    loadingLogin.value = false
  }
}

function onRegisterSubmit() {
  regErrorMessage.value = ''
  if (!regUsername.value.trim()) {
    regErrorMessage.value = 'Username is required.'
    return
  } else if (!regPassword.value.trim()) {
    regErrorMessage.value = 'Password is required.'
    return
  }
  loadingRegister.value = true

  createUser(regUsername.value, regPassword.value)
      .then(async () => {

        await login(regUsername.value, regPassword.value)

        router.push({ name: 'board' })

        loadingRegister.value = false
        isLogin.value = true

        username.value = regUsername.value
        regUsername.value = ''
        regPassword.value = ''

        create?.({
          title: 'Success',
          body: 'Account created and logged in successfully!',
          variant: 'success',
          autoHideDelay: 3000,
        })
      })
      .catch(error => {
        regErrorMessage.value = error.message
        loadingRegister.value = false
      })
}

function showLogin() {
  isLogin.value = true
  regErrorMessage.value = ''
}

function showRegister() {
  isLogin.value = false
  errorMessage.value = ''
}

onMounted(() => {
  store.user = undefined
  if (router.currentRoute.value.query.expired) {
    create?.({
      title: 'Session expired',
      body: 'Please log in again.',
      variant: 'danger',
      autoHideDelay: 3000,
    })
    router.currentRoute.value.query.expired = undefined
  }
})
</script>

<template>
  <BRow class="justify-content-center align-items-center min-vh-75">
    <BCol cols="12" md="6" lg="5">
      <BCard class="shadow-sm border-0">
        <BCardBody class="p-4 p-md-5">
          <div class="text-center mb-4">
            <p class="text-muted mb-0">
              {{ isLogin ? 'Log in to access your boards' : 'Create an account to get started' }}
            </p>
          </div>

          <!-- Login -->
          <BForm v-if="isLogin" @submit.prevent="onSubmit">
            <BFormGroup label="Username" label-for="username">
              <BFormInput
                id="username"
                v-model="username"
                type="text"
                placeholder="Username"
                autocomplete="username"
                size="lg"
              />
              <BFormGroup label="Password" label-for="password">
                <BFormInput
                    id="password"
                    v-model="password"
                    type="password"
                    placeholder="Password"
                    autocomplete="current-password"
                    size="lg"
                />
              </BFormGroup>
            </BFormGroup>

            <div v-if="errorMessage" class="alert alert-danger py-2 mb-3" role="alert">
              {{ errorMessage }}
            </div>

            <div class="d-grid gap-2">
              <BButton type="submit" variant="primary" size="lg" class="fw-semibold" :disabled="loadingLogin" :loading="loadingLogin" :loading-text="'Logging in...'">
                Log in
              </BButton>
            </div>

            <p class="text-center text-muted mt-3 mb-0 small">
              Don't have an account?
              <BButton variant="link" class="p-0 align-baseline fw-semibold" @click="showRegister">
                Sign up
              </BButton>
            </p>
          </BForm>

          <!-- Register -->
          <BForm v-else @submit.prevent="onRegisterSubmit">
            <BFormGroup label="Username" label-for="reg-username">
              <BFormInput
                id="reg-username"
                v-model="regUsername"
                type="text"
                placeholder="Choose a username"
                autocomplete="username"
                size="lg"
              />
              <BFormGroup label="Password" label-for="reg-password">
                <BFormInput
                    id="reg-password"
                    v-model="regPassword"
                    type="password"
                    placeholder="Choose a password"
                    size="lg"
                />
              </BFormGroup>
            </BFormGroup>

            <div v-if="regErrorMessage" class="alert alert-danger py-2 mb-3" role="alert">
              {{ regErrorMessage }}
            </div>

            <div class="d-grid gap-2">
              <BButton type="submit" variant="primary" size="lg" class="fw-semibold" :disabled="loadingRegister" :loading="loadingRegister" :loading-text="'Registering...'">
                Sign up
              </BButton>
            </div>

            <p class="text-center text-muted mt-3 mb-0 small">
              Already have an account?
              <BButton variant="link" class="p-0 align-baseline fw-semibold" @click="showLogin">
                Log in
              </BButton>
            </p>
          </BForm>
        </BCardBody>
      </BCard>
    </BCol>
  </BRow>
</template>

<style scoped>
.min-vh-75 {
  min-height: 75vh;
}
</style>
