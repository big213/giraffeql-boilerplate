<template>
  <v-card>
    <StripeElements
      :stripe-key="stripeKey"
      :instance-options="instanceOptions"
      :elements-options="elementsOptions"
      #default="{ elements }"
      ref="elms"
    >
      <StripeElement
        type="card"
        :elements="elements"
        :options="cardOptions"
        ref="card"
      />
    </StripeElements>
    <v-btn block color="primary" @click="pay">Pay</v-btn>
  </v-card>
</template>

<script>
import { StripeElements, StripeElement } from 'vue-stripe-elements-plus'
import { executeGiraffeql } from '~/services/giraffeql'

export default {
  name: 'PaymentSimple',

  components: {
    StripeElements,
    StripeElement,
  },

  data() {
    return {
      stripeKey: process.env.stripePubKey,
      instanceOptions: {
        // https://stripe.com/docs/js/initializing#init_stripe_js-options
      },
      elementsOptions: {
        // https://stripe.com/docs/js/elements_object/create#stripe_elements-options
      },
      cardOptions: {
        // reactive
        // remember about Vue 2 reactivity limitations when dealing with options
        value: {
          postalCode: '',
        },
        mode: 'payment',
        // https://stripe.com/docs/stripe.js#element-options
      },
    }
  },

  methods: {
    pay() {
      // ref in template
      console.log(this.$refs)
      const groupComponent = this.$refs.elms
      const cardComponent = this.$refs.card
      // Get stripe element
      const cardElement = cardComponent.stripeElement

      // Access instance methods, e.g. createToken()
      groupComponent.instance.createToken(cardElement).then(async (result) => {
        console.log(result)
        // send the result.token to server with other info like the amount, currency, description
        const data = await executeGiraffeql(this, {
          processStripePayment: {
            __args: {
              token: result.token.id,
              amount: 999,
              description: 'example charge',
            },
          },
        })

        // Handle result.error or result.token
      })
    },
  },
}
</script>
