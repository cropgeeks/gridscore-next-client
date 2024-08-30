<template>
  <div>
    <b-button class="btn-circle" id="jump-navigation" variant="primary" @click="visible = !visible"><IBiArrowsMove /></b-button>

    <b-popover :model-value="visible" manual no-fade ref="navigationPopover" target="jump-navigation" boundary="viewport" container="jump-navigation" triggers="click blur" placement="left" :variant="storeDarkMode ? 'dark' : 'light'">
      <div class="direction-grid">
        <div><b-button @click.capture.stop="moveTowards('topLeft')"><IBiArrowUp :style="{ transform: 'rotate(-45deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('top')"><IBiArrowUp :style="{ transform: 'rotate(0deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('topRight')"><IBiArrowUp :style="{ transform: 'rotate(45deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('left')"><IBiArrowUp :style="{ transform: 'rotate(-90deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="visible = false"><IBiSlashCircle /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('right')"><IBiArrowUp :style="{ transform: 'rotate(90deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottomLeft')"><IBiArrowUp :style="{ transform: 'rotate(-135deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottom')"><IBiArrowUp :style="{ transform: 'rotate(180deg)' }" /></b-button></div>
        <div><b-button @click.capture.stop="moveTowards('bottomRight')"><IBiArrowUp :style="{ transform: 'rotate(135deg)' }" /></b-button></div>
      </div>
    </b-popover>
  </div>
</template>

<script>
import { mapState, mapStores } from 'pinia'
import { coreStore } from '@/store'

import emitter from 'tiny-emitter/instance'

export default {
  data: function () {
    return {
      visible: false
    }
  },
  computed: {
    ...mapStores(coreStore),
    ...mapState(coreStore, [
      'storeDarkMode'
    ])
  },
  methods: {
    moveTowards: function (corner) {
      emitter.emit('move-to-corner', corner)
      emitter.emit('plausible-event', { key: 'data-view-jump', props: { type: corner } })
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
