import { mount } from '@vue/test-utils'
import EditableLabel from '../src/components/shared/inline-edit/EditableLabel.vue'

test('renders a todo', () => {
  const wrapper = mount(EditableLabel)

  const todo = wrapper.get('[data-test="todo"]')

  expect(todo.text()).toBe('Learn Vue.js 3')
})
