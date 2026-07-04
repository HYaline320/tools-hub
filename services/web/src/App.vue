<template>
  <div id="app">
    <header>
      <h1>工具合集</h1>
      <nav>
        <router-link to="/">首页</router-link>
      </nav>
    </header>
    <main>
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
</script>

<style>
body { margin: 0; font-family: sans-serif; }
header { background: #eee; padding: 1rem; }
nav a { margin-right: 1rem; }
</style>