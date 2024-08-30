<template>
  <div v-if="code">
    <div ref="svg" id="qrcode" class="text-center" />
    <template v-if="showCode">
      <p class="text-center">{{ text }}</p>
      <b-form-input v-model="code" readonly @focus="$event.target.select()" />
    </template>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'
import QRCodeStyling from 'qr-code-styling'

const imageData = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDEzNS40NjcgMTM1LjQ2NyIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgyOS4xODkgLTguMzIzKSI+PHJlY3Qgc3R5bGU9ImZpbGw6IzM0NDk1ZTtmaWxsLW9wYWNpdHk6MTtzdHJva2U6bm9uZTtzdHJva2Utd2lkdGg6Ljc5NDtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46YmV2ZWw7c3Ryb2tlLWRhc2hhcnJheTpub25lIiB3aWR0aD0iMTM1LjQ2NyIgaGVpZ2h0PSIxMzUuNDY3IiB4PSItMjkuMTg5IiB5PSI4LjMyMyIgcnk9IjAiLz48Y2lyY2xlIHN0eWxlPSJmaWxsOiM5MTAwODA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOi40NTc2MTg7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kIiBjeD0iLTI5LjQ5MyIgY3k9IjQ1LjM3NCIgcj0iMjguNTkyIiB0cmFuc2Zvcm09InJvdGF0ZSgtNDYuODQpIi8+PGNpcmNsZSBzdHlsZT0iZmlsbDojZmY3YzAwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDouNDU3NjE4O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZCIgY3g9IjY0Ljk3OSIgY3k9IjE5LjU5MyIgcj0iMjguNTkyIiB0cmFuc2Zvcm09InJvdGF0ZSgyNS4xNikiLz48Y2lyY2xlIHN0eWxlPSJmaWxsOiM1ZWM0MTg7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOi40NTc2MTg7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kIiBjeD0iNjkuNjUyIiBjeT0iLTc4LjIyMiIgcj0iMjguNTkyIiB0cmFuc2Zvcm09InJvdGF0ZSg5Ny4xNikiLz48Y2lyY2xlIHN0eWxlPSJmaWxsOiMwMGEwZjE7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOi40NTc2MTg7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kIiBjeD0iLTIxLjkzMSIgY3k9Ii0xMTIuODk0IiByPSIyOC41OTIiIHRyYW5zZm9ybT0icm90YXRlKDE2OS4xNikiLz48Y2lyY2xlIHN0eWxlPSJmaWxsOiNjNWUwMDA7ZmlsbC1vcGFjaXR5OjE7c3Ryb2tlLXdpZHRoOi40NTc2MTg7c3Ryb2tlLWxpbmVjYXA6cm91bmQ7c3Ryb2tlLWxpbmVqb2luOnJvdW5kIiBjeD0iLTgzLjIwNyIgY3k9Ii0zNi41MDciIHI9IjI4LjU5MiIgdHJhbnNmb3JtPSJyb3RhdGUoLTExOC44NCkiLz48cGF0aCBzdHlsZT0iZmlsbDojZmY3YzgwO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDouNDU3NjE4O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZCIgZD0iTTI3LjcxNiAyOC4wODRhMjguNTkyIDI4LjU5MiAwIDAgMC0zLjExMSA1LjEyIDI4LjU5MiAyOC41OTIgMCAwIDAgMTEuMDkyIDM2LjYwNCAyOC41OTIgMjguNTkyIDAgMCAwLTMuMjE1LTM4LjExMyAyOC41OTIgMjguNTkyIDAgMCAwLTQuNzY2LTMuNjFaIi8+PHBhdGggc3R5bGU9ImZpbGw6IzVlZTlmMjtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6LjQ1NzYxODtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQiIGQ9Ik00MC4zNjUgNzguMjY1YTI4LjU5MiAyOC41OTIgMCAwIDAgMjUuMDAzIDI4Ljk2MiAyOC41OTIgMjguNTkyIDAgMCAwIDUuOTc4LjEwOCAyOC41OTIgMjguNTkyIDAgMCAwLS40OTItNS45NTggMjguNTkyIDI4LjU5MiAwIDAgMC0zMC40OS0yMy4xMTJ6Ii8+PHBhdGggc3R5bGU9ImZpbGw6I2ZmZTExODtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6LjQ1NzYxODtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQiIGQ9Ik00Ny41IDU5LjkzM2EyOC41OTIgMjguNTkyIDAgMCAwLTYuMzkgMTIuNDE3IDI4LjU5MiAyOC41OTIgMCAwIDAgMzUuMjU0LTE0LjgzNiAyOC41OTIgMjguNTkyIDAgMCAwIDEuOTYzLTUuNjU5IDI4LjU5MiAyOC41OTIgMCAwIDAtNS44MzItMS4zNjZBMjguNTkyIDI4LjU5MiAwIDAgMCA0Ny41IDU5LjkzM1oiLz48cGF0aCBzdHlsZT0iZmlsbDojYzVmM2YxO2ZpbGwtb3BhY2l0eToxO3N0cm9rZS13aWR0aDouNDU3NjE4O3N0cm9rZS1saW5lY2FwOnJvdW5kO3N0cm9rZS1saW5lam9pbjpyb3VuZCIgZD0iTTIyLjUxIDg2LjU4MmEyOC41OTIgMjguNTkyIDAgMCAwLTcuODIgMjUuNTUgMjguNTkyIDI4LjU5MiAwIDAgMCAxLjc0NSA1LjcxOSAyOC41OTIgMjguNTkyIDAgMCAwIDUuNTE0LTIuMzEgMjguNTkyIDI4LjU5MiAwIDAgMCAxMi41NDItMzYuMTMzIDI4LjU5MiAyOC41OTIgMCAwIDAtMTEuOTggNy4xNzR6Ii8+PHBhdGggc3R5bGU9ImZpbGw6I2U2ZTA4MDtmaWxsLW9wYWNpdHk6MTtzdHJva2Utd2lkdGg6LjQ1NzYxODtzdHJva2UtbGluZWNhcDpyb3VuZDtzdHJva2UtbGluZWpvaW46cm91bmQiIGQ9Ik0tMTAuNTM0IDY4Ljg3NmEyOC41OTIgMjguNTkyIDAgMCAwIDMuOSA0LjUzMiAyOC41OTIgMjguNTkyIDAgMCAwIDM4LjI1NS43NUEyOC41OTIgMjguNTkyIDAgMCAwLTUuNjM0IDY1LjQ1YTI4LjU5MiAyOC41OTIgMCAwIDAtNC45IDMuNDI1eiIvPjwvZz48L3N2Zz4='

export default {
  props: {
    baseUrl: {
      type: String,
      default: null
    },
    text: {
      type: String,
      default: null
    },
    showCode: {
      type: Boolean,
      default: true
    },
    isTrialCode: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
    ]),
    code: function () {
      if (this.text) {
        if (this.isTrialCode) {
          const uuidPart = this.$router.resolve({ name: 'trial-import-code', params: { shareCode: this.text } }).path

          if (this.baseUrl) {
            return this.baseUrl + '#' + uuidPart
          } else {
            let origin = window.location.origin
            let pathname = window.location.pathname

            if (origin.lastIndexOf('/') === origin.length - 1) {
              origin = origin.substring(0, origin.length - 1)
            }
            if (pathname.length > 0 && pathname[0] === '/') {
              pathname = pathname.substring(1)
            }
            if (pathname.lastIndexOf('/') === pathname.length - 1) {
              pathname = pathname.substring(0, pathname.length - 1)
            }

            if (pathname.length > 0) {
              pathname = pathname + '/'
            }

            return origin + '/' + pathname + '#' + uuidPart
          }
        } else {
          return this.text
        }
      } else {
        return null
      }
    }
  },
  watch: {
    code: function () {
      this.updateBarcode()
    }
  },
  methods: {
    updateBarcode: function () {
      if (this.code) {
        this.$nextTick(() => {
          if (!this.codeWriter) {
            this.codeWriter = new QRCodeStyling({
              margin: this.storeDarkMode ? 20 : 0,
              width: 300,
              height: 300,
              data: this.code,
              // type: 'svg', // We don't use the SVG option, because we want people to be able to right-click and copy QR codes.
              dotsOptions: {
                type: 'rounded'
              },
              imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.4,
                margin: 0
              },
              image: imageData
            })
            this.codeWriter.append(this.$refs.svg)
          } else {
            this.codeWriter.update({
              data: this.code
            })
            this.codeWriter.append(this.$refs.svg)
          }
        })
      } else {
        // TODO
      }
    }
  },
  mounted: function () {
    this.updateBarcode()
  }
}
</script>

<style>
</style>
