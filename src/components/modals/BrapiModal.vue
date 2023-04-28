<template>
  <b-modal :title="$t(title)"
           :ok-title="$t(okTitle)"
           :cancel-title="$t(cancelTitle)"
           :ok-disabled="okDisabled"
           @ok.prevent="$emit('submit')"
           scrollable
           no-fade
           :size="size"
           ref="brapiModal">
    <b-form @submit.prevent="updateBrapiUrl">
      <b-form-group label-for="brapiUrl">
        <template v-slot:label>
          <span v-html="$t('formLabelBrapiUrl')" />
        </template>
        <template slot="description">
          <span v-html="$t('formDescriptionBrapiUrl')" />
        </template>
        <!-- BrAPI URL input field -->
        <b-form-input v-model="brapiUrl" id="brapiUrl" />
      </b-form-group>
      <b-form-group label-for="brapiToken" :label="$t('formLabelBrapiToken')" :description="$t('formDescriptionBrapiToken')">
        <!-- BrAPI token input field -->
        <b-form-input id="brapiToken" v-model="brapiToken" />
      </b-form-group>

      <!-- Button to update the BrAPI URL in the store -->
      <b-button @click="updateBrapiUrl"><BIconArrowClockwise /> {{ $t('buttonUpdate') }}</b-button>
    </b-form>

    <!-- Slot that wrapping components can use to fill in their content -->
    <div class="mt-3">
      <slot name="content" />
    </div>
  </b-modal>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconArrowClockwise } from 'bootstrap-vue'

/**
 * Base modal used to show a BrAPI URL input field at the top. Wrapping components can use the `content` slot to add their own content.
 */
export default {
  components: {
    BIconArrowClockwise
  },
  data: function () {
    return {
      brapiUrl: null,
      brapiToken: null
    }
  },
  props: {
    /** The modal `title` i18n identifier */
    title: {
      type: String,
      default: ''
    },
    /** The modal `ok` button i18n identifier */
    okTitle: {
      type: String,
      default: 'buttonOk'
    },
    /** The modal `cancel` button i18n identifier */
    cancelTitle: {
      type: String,
      default: 'buttonCancel'
    },
    okDisabled: {
      type: Boolean,
      default: false
    },
    size: {
      type: String,
      default: 'md'
    }
  },
  computed: {
    /** Mapgetters exposing the store configuration */
    ...mapGetters([
      'storeBrapiConfig'
    ])
  },
  methods: {
    /**
     * Shows the modal and gets the current BrAPI URL from the configuration
     */
    show: function () {
      this.brapiUrl = this.storeBrapiConfig && this.storeBrapiConfig.url ? this.storeBrapiConfig.url : null
      this.brapiToken = this.storeBrapiConfig && this.storeBrapiConfig.token ? this.storeBrapiConfig.token : null
      this.$nextTick(() => this.$refs.brapiModal.show())
    },
    /**
     * Hides the modal
     */
    hide: function () {
      this.$nextTick(() => this.$refs.brapiModal.hide())
    },
    /**
     * Returns the BrAPI URL
     */
    getBrapiUrl: function () {
      return this.brapiUrl
    },
    /**
     * Pushes the changed BrAPI URL to the store
     */
    updateBrapiUrl: function () {
      this.$store.commit('ON_BRAPI_CONFIG_CHANGED', {
        url: this.brapiUrl,
        token: this.brapiToken
      })

      this.$nextTick(() => this.$emit('brapi-settings-changed', { url: this.brapiUrl, token: this.brapiToken }))
    }
  }
}
</script>

<style>

</style>
