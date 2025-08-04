<template>
  <b-modal :ok-title="$t('buttonClose')"
           :title="$t('modalTitleSearchMatches')"
           @hidden="$emit('hidden')"
           ok-only
           no-fade
           ref="searchMatchModal">
    <b-list-group v-if="searchMatches && searchMatches.length > 0">
      <b-list-group-item href="#" @click.prevent="handleClick(match)" v-for="match in searchMatches" :key="`search-match-${match.row}-${match.column}`">
        <h5>{{ match.displayName }}</h5>
        <b-badge>{{ $t('modalTextSearchMatchRow', { row: match.displayRow }) }}</b-badge>
        <b-badge class="ms-2">{{ $t('modalTextSearchMatchColumn', { column: match.displayColumn }) }}</b-badge>
      </b-list-group-item>
    </b-list-group>
  </b-modal>
</template>

<script>
import emitter from 'tiny-emitter/instance'

export default {
  props: {
    searchMatches: {
      type: Array,
      default: () => []
    }
  },
  methods: {
    handleClick: function (match) {
      emitter.emit('plot-clicked', match.row, match.column, true)
      this.hide()
    },
    /**
     * Shows the modal dialog
     */
    show: function () {
      this.$nextTick(() => this.$refs.searchMatchModal.show())
    },
    /**
     * Hides the modal dialog and resets it to its initial state
     */
    hide: function () {
      this.$nextTick(() => this.$refs.searchMatchModal.hide())
    }
  }
}
</script>

<style>
</style>
