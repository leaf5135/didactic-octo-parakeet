class Ui::CardComponent < ViewComponent::Base
  def initialize(**options)
    @options = options
  end

  def call
    content_tag(:div, class: card_classes, **@options) do
      content
    end
  end

  private

  def card_classes
    base_classes = "overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white"
    "#{base_classes} #{@options[:class]}".strip
  end
end