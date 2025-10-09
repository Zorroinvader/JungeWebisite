// Simple event bus for cross-component communication
class EventBus {
  constructor() {
    this.events = {}
  }

  // Subscribe to an event
  on(event, callback) {
    if (!this.events[event]) {
      this.events[event] = []
    }
    this.events[event].push(callback)
  }

  // Unsubscribe from an event
  off(event, callback) {
    if (!this.events[event]) return
    this.events[event] = this.events[event].filter(cb => cb !== callback)
  }

  // Emit an event
  emit(event, data) {
    if (!this.events[event]) return
    this.events[event].forEach(callback => callback(data))
  }
}

// Create a singleton instance
const eventBus = new EventBus()

export default eventBus
