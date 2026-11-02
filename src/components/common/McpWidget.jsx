import './McpWidget.css'

export default function McpWidget({ widget }) {
  return (
    <div className={`mcp-widget${widget.hasOwners ? ' mcp-widget-ownership' : ''}${widget.hasEtas ? ' mcp-widget-etas' : ''}`}>
      <iframe
        title={widget.title}
        srcDoc={widget.html}
        sandbox=""
        referrerPolicy="no-referrer"
      />
    </div>
  )
}
