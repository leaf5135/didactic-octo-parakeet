class Ui::ButtonComponent < ViewComponent::Base
  def initialize(variant: :primary, size: :default, type: "button", **options)
    @variant = variant
    @size = size
    @type = type
    @options = options
  end

  def call
    button_tag(@options.delete(:content) || content, type: @type, class: button_classes, **@options)
  end

  private

  def button_classes
    base_classes = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    variant_classes = case @variant
    when :primary
      "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-500"
    when :secondary
      "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500"
    when :destructive
      "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500"
    when :outline
      "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus-visible:ring-gray-500"
    when :ghost
      "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500"
    when :link
      "text-indigo-600 underline-offset-4 hover:underline"
    else
      ""
    end

    size_classes = case @size
    when :sm
      "h-9 px-3 text-sm"
    when :lg
      "h-11 px-8 text-base"
    else
      "h-10 px-4 text-sm"
    end

    "#{base_classes} #{variant_classes} #{size_classes} #{@options[:class]}".strip
  end
end