const App = () => {
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const element = await webflow.getSelectedElement()
    if (element?.textContent) {
      element.setTextContent(
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do ' +
          'eiusmod tempor incididunt ut labore et dolore magna aliqua.'
      )
      element.save()
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit}>
        <div>
          Select a textual element in the Designer and press the button below to
          give it some placeholder content.
        </div>
        <button>Change text</button>
      </form>
    </div>
  )
}

export default App
