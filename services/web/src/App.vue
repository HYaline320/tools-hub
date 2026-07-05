<template>
  <div id="app">
    <header class="app-header">
      <h1>ToolsHub</h1>
      <nav>
        <router-link to="/">首页</router-link>
      </nav>
    </header>
    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style src="./App.css"></style>