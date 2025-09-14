class Ui::InputComponent < ViewComponent::Base
  def initialize(type: "text", **options)
    @type = type
    @options = options
  end

  def call
    text_field_tag(@options.delete(:name), @options.delete(:value), type: @type, class: input_classes, **@options)
  end

  private

  def input_classes
    base_classes = "flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    "#{base_classes} #{@options[:class]}".strip
  end
end