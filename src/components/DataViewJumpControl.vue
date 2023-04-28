<template>
  <div>
    <b-button class="btn-circle" id="jump-navigation" variant="primary"><BIconArrowsMove /></b-button>

    <b-popover ref="navigationPopover" target="jump-navigation" boundary="viewport" container="jump-navigation" triggers="click blur" placement="left" :variant="storeDarkMode ? 'dark' : null">
      <div class="direction-grid p-2">
        <div><b-button @click.capture.stop="moveTowards('topLeft')"><BIconArrowUp :rotate="-45" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('top')"><BIconArrowUp :rotate="0" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('topRight')"><BIconArrowUp :rotate="45" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('left')"><BIconArrowUp :rotate="-90" /></b-button></div>
        <div><b-button @click.capture.stop="$refs.navigationPopover.$emit('close')"><BIconSlashCircle /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('right')"><BIconArrowUp :rotate="90" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottomLeft')"><BIconArrowUp :rotate="-135" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottom')"><BIconArrowUp :rotate="180" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottomRight')"><BIconArrowUp :rotate="135" /></b-button></div>
      </div>
    </b-popover>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { BIconArrowsMove, BIconArrowUp, BIconSlashCircle } from 'bootstrap-vue'

const emitter = require('tiny-emitter/instance')

export default {
  components: {
    BIconArrowsMove,
    BIconArrowUp,
    BIconSlashCircle
  },
  computed: {
    ...mapGetters([
      'storeDarkMode'
    ])
  },
  methods: {
    moveTowards: function (corner) {
      emitter.emit('move-to-corner', corner)
    }
  }
}
</script>

<style scoped>
#jump-navigation {
  position: fixed;
  transition: opacity linear 0.1s;
  opacity: 0.66;
}
#jump-navigation {
  right: 1em;
  bottom: 20%;
}
#jump-navigation:hover,
#jump-navigation:focus {
  opacity: 1;
}
.btn-circle {
  width: 50px;
  height: 50px;
  padding: 7px 10px;
  border-radius: 25px;
  text-align: center;
}

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
