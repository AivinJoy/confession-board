<script lang="ts">
  import { enhance } from '$app/forms';
  
  export let form;
  let loading = false;
</script>

<div class="min-h-screen bg-gray-200 flex flex-col items-center justify-center p-4">
  
  <div class="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden p-8">
    
    <div class="text-center mb-8">
      <h1 class="text-3xl font-extrabold tracking-tight text-gray-800">VAST LOGIN</h1>
      <p class="text-gray-400 italic mt-2 font-serif text-sm">~ Enter Credentials to Verify ~</p>
    </div>

    {#if form?.error}
      <div class="bg-red-100 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm text-center font-medium">
        {form.error}
      </div>
    {/if}

    <form 
      method="POST" 
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          loading = false;
          update();
        };
      }}
      class="flex flex-col gap-5"
    >
      
      <div class="flex flex-col gap-1">
        <label for="username" class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Student ID</label>
        <input 
          type="text" 
          name="username" 
          id="username"
          placeholder="TL....."
          required
          class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-black/20 transition-colors font-mono"
        />
      </div>

      <div class="flex flex-col gap-1">
        <label for="password" class="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
        <input 
          type="password" 
          name="password" 
          id="password"
          placeholder="D/M/YYYY"
          required
          class="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 outline-none focus:border-black/20 transition-colors"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        class="mt-4 w-full bg-black text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if loading}
          VERIFYING...
        {:else}
          LOGIN TO CONFESS
        {/if}
      </button>

    </form>
    
    <p class="text-center text-xs text-gray-300 mt-6">
      Your credentials are used for verification purposes only.
    </p>

  </div>
</div>