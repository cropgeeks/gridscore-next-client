import Vue from 'vue'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import { i18n } from '@/plugins/i18n.js'
import { BadgePlugin, ButtonGroupPlugin, ButtonPlugin, ButtonToolbarPlugin, CardPlugin, DropdownPlugin, FormCheckboxPlugin, FormDatepickerPlugin, FormFilePlugin, FormGroupPlugin, FormInputPlugin, FormPlugin, FormRadioPlugin, FormSelectPlugin, FormTextareaPlugin, ImagePlugin, InputGroupPlugin, LayoutPlugin, ListGroupPlugin, ModalPlugin, NavbarPlugin, PaginationPlugin, PopoverPlugin, SidebarPlugin, SpinnerPlugin, TabsPlugin, TooltipPlugin } from 'bootstrap-vue'

Vue.use(BadgePlugin)
Vue.use(ButtonPlugin)
Vue.use(ButtonGroupPlugin)
Vue.use(ButtonToolbarPlugin)
Vue.use(CardPlugin)
Vue.use(DropdownPlugin)
Vue.use(FormPlugin)
Vue.use(FormCheckboxPlugin)
Vue.use(FormDatepickerPlugin)
Vue.use(FormGroupPlugin)
Vue.use(FormInputPlugin)
Vue.use(FormFilePlugin)
Vue.use(FormRadioPlugin)
Vue.use(FormSelectPlugin)
Vue.use(FormTextareaPlugin)
Vue.use(ImagePlugin)
Vue.use(InputGroupPlugin)
Vue.use(LayoutPlugin)
Vue.use(ListGroupPlugin)
Vue.use(ModalPlugin)
Vue.use(NavbarPlugin)
Vue.use(PaginationPlugin)
Vue.use(PopoverPlugin)
Vue.use(SidebarPlugin)
Vue.use(SpinnerPlugin)
Vue.use(TabsPlugin)
Vue.use(TooltipPlugin)

Vue.config.productionTip = false

// Set base URL based on environment
let baseUrl = './api/'

if (process.env.VUE_APP_BASE_URL) {
  baseUrl = process.env.VUE_APP_BASE_URL
}

store.commit('ON_SERVER_URL_CHANGED', baseUrl)

new Vue({
  router,
  store,
  i18n,
  render: h => h(App)
}).$mount('#app')
