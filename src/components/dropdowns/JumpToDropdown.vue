<template>
  <b-dropdown :title="$t('toolbarJumpTo')" ref="cornerDropdown">
    <template v-slot:button-content>
      <BIconArrowsFullscreen /> <span class="d-none d-lg-inline-block">{{ $t('toolbarJumpTo') }}</span>
    </template>

    <div class="direction-grid p-2">
      <div><b-button @click="scrollTo('topLeft')"><BIconArrowUp :rotate="-45" /></b-button></div>
      <div><b-button @click="scrollTo('top')"><BIconArrowUp :rotate="0" /></b-button></div>
      <div><b-button @click="scrollTo('topRight')"><BIconArrowUp :rotate="45" /></b-button></div>
      <div><b-button @click="scrollTo('left')"><BIconArrowUp :rotate="-90" /></b-button></div>
      <div><b-button @click="scrollTo('center')"><BIconCircleFill /></b-button></div>
      <div><b-button @click="scrollTo('right')"><BIconArrowUp :rotate="90" /></b-button></div>
      <div><b-button @click="scrollTo('bottomLeft')"><BIconArrowUp :rotate="-135" /></b-button></div>
      <div><b-button @click="scrollTo('bottom')"><BIconArrowUp :rotate="180" /></b-button></div>
      <div><b-button @click="scrollTo('bottomRight')"><BIconArrowUp :rotate="135" /></b-button></div>
      <b-button @click="scrollTo('gps')" class="gps-button" v-if="storeGpsEnabled"><BIconGeoAltFill /> {{ $t('buttonGPS') }}</b-button>
    </div>
  </b-dropdown>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconArrowsFullscreen, BIconArrowUp, BIconGeoAltFill, BIconCircleFill } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconArrowsFullscreen,
    BIconArrowUp,
    BIconCircleFill,
    BIconGeoAltFill
  },
  computed: {
    ...mapGetters([
      'storeGpsEnabled'
    ])
  },
  methods: {
    scrollTo: function (corner) {
      emitter.emit('jump-to-corner', corner)
      this.$refs.cornerDropdown.hide()
    }
  }
}
</script>

<style scoped>
.direction-grid {
  display: grid;
  grid-gap: 1px;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 10px;
  row-gap: 10px;
}
.direction-grid > div {
  justify-self: center;
  align-self: center;
}
.direction-grid .gps-button {
  grid-column: 1 / span 3;
}
</style>
