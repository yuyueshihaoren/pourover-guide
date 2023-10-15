<script setup lang="ts">
const formState = ref<{
  recipe: {
    coffee: number;
    water: number;
    pours: {
      weight: number;
      time: number;
      restTime: number;
    }[];
  };
  scaling: "linear" | "custom" | "none";
  actual: {
    coffee?: number;
    water?: number;
  };
}>({
  recipe: {
    coffee: 0,
    water: 0,
    pours: [
      {
        weight: 15,
        time: 10,
        restTime: 25,
      },
    ],
  },
  scaling: "none",
  actual: {},
});

const scaling = computed({
  get() {
    return formState.value.scaling !== "none";
  },
  set(val: boolean) {
    if (val) {
      formState.value.scaling = "linear";
    } else {
      formState.value.scaling = "none";
    }
  },
});

const linearRatio = computed(() => {
  const { recipe, actual } = formState.value;
  if (recipe.coffee === 0 || recipe.water === 0) return undefined;
  if (actual.coffee) {
    return actual.coffee / recipe.coffee;
  }
  if (actual.water) {
    return actual.water / recipe.water;
  }
  return undefined;
});

const computedActualCoffee = computed(() =>
  linearRatio.value
    ? formState.value.recipe.coffee * linearRatio.value
    : undefined
);
const coffeeModel = computed({
  get(): number | undefined {
    return computedActualCoffee.value ?? formState.value.actual.coffee;
  },
  set(val?: number) {
    formState.value.actual.coffee = val;
    formState.value.actual.water = undefined;
  },
});

const computedActualWater = computed(() =>
  linearRatio.value
    ? formState.value.recipe.water * linearRatio.value
    : undefined
);
const waterModel = computed({
  get() {
    return computedActualWater.value ?? formState.value.actual.water;
  },
  set(val?: number) {
    formState.value.actual.water = val;
    formState.value.actual.coffee = undefined;
  },
});

const totalTime = computed(() => {
  const { recipe } = formState.value;
  return recipe.pours.reduce((acc, curr) => acc + curr.time + curr.restTime, 0);
});

const countdown = ref<number | undefined>(undefined);
const { pause, resume, isActive } = useIntervalFn(
  () => {
    countdown.value = (countdown.value ?? totalTime.value) - 1;
  },
  1000,
  { immediate: false }
);

function playBeep() {
  const beep = new AudioContext();
  const oscillator = beep.createOscillator();
  oscillator.connect(beep.destination);
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(1000, beep.currentTime); // Set the frequency to 1000 Hz
  oscillator.start();
  oscillator.stop(beep.currentTime + 0.1); // Stop the tone after 0.1 seconds
}

watchImmediate(countdown, (val) => {
  if (val === 0) {
    if (isActive.value) {
      playBeep();
    }
    pause();
  }
});
</script>

<template>
  <UContainer>
    <h1 class="text-3xl font-bold">Pour over guide</h1>
    <UForm class="max-w-lg mx-auto" :state="formState">
      <h2>Recipe</h2>
      <UFormGroup name="coffee" label="Coffee">
        <div class="flex gap-2">
          <UInput v-model.number="formState.recipe.coffee" />
          g
        </div>
      </UFormGroup>
      <UFormGroup name="water" label="Water">
        <div class="flex gap-2">
          <UInput v-model.number="formState.recipe.water" />
          g
        </div>
      </UFormGroup>
      <section>
        <div class="flex mt-4 justify-start">
          <span>Pours</span>
          <UButton
            :padded="false"
            class="px-2 mx-2"
            @click="
              formState.recipe.pours.push({
                weight: 0,
                time: 0,
                restTime: 0,
              })
            "
            >Add</UButton
          >
        </div>
        <div class="flex flex-col gap-2">
          <div
            v-for="(pour, ind) in formState.recipe.pours"
            class="flex gap-2 items-end"
          >
            <UFormGroup size="sm" :name="`weight (${ind})`" label="weight">
              <div class="flex gap-2">
                <UInput
                  type="number"
                  v-model.number="formState.recipe.pours[ind].weight"
                />
                g
              </div>
            </UFormGroup>
            <UFormGroup :name="`time (${ind})`" label="time">
              <div class="flex gap-2">
                <UInput
                  type="number"
                  v-model.number="formState.recipe.pours[ind].time"
                />
                secs
              </div>
            </UFormGroup>
            <UFormGroup :name="`rest time (${ind})`" label="rest time">
              <div class="flex gap-2">
                <UInput
                  type="number"
                  v-model.number="formState.recipe.pours[ind].restTime"
                />
                secs
              </div>
            </UFormGroup>
            <UButton @click="formState.recipe.pours.splice(ind, 1)"
              >Remove</UButton
            >
          </div>
        </div>
      </section>
      <section>
        <div class="flex gap-2 mt-2">
          <UToggle v-model="scaling" />Scale the recipe
        </div>
        <div v-if="scaling">
          <USelectMenu
            class="max-w-xs"
            v-model="formState.scaling"
            :options="['linear', 'custom']"
          />
          <UFormGroup label="Actual coffee">
            <div class="flex gap-2">
              <UInput v-model.number="coffeeModel" />
              g
            </div>
          </UFormGroup>
          <UFormGroup label="Actual water">
            <div class="flex gap-2">
              <UInput v-model.number="waterModel" />
              g
            </div>
          </UFormGroup>
        </div>
      </section>
      <section>
        <div>Total time is {{ totalTime }} seconds</div>
        <UButton
          :label="isActive ? `Stop` : `Start`"
          class="mt-2"
          @click="
            () => {
              if (isActive) {
                pause();
              } else {
                countdown = totalTime;
                resume();
              }
            }
          "
        />
        <!-- <div class="text-xl mt-2 border w-fit p-3 rounded-full">
          {{ countdown }}
        </div> -->
        <svg
          class="w-32 h-32 mt-2"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="black"
            stroke-width="3"
            fill="none"
          />
          <text x="51" y="55" text-anchor="middle" fill="black" font-size="20">
            {{ countdown }}
          </text>
        </svg>
      </section>
    </UForm>
  </UContainer>
</template>
