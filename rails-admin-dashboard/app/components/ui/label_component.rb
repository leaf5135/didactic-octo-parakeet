class Ui::LabelComponent < ViewComponent::Base
  def initialize(for_input: nil, **options)
    @for_input = for_input
    @options = options
  end

  def call
    label_tag(@for_input, content || @options.delete(:text), class: label_classes, **@options)
  end

  private

  def label_classes
    base_classes = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
    "#{base_classes} #{@options[:class]}".strip
  end
end