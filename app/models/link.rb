class Link < ApplicationRecord
  belongs_to :user
  has_one_attached :file
  has_one_attached :preview_file

  validates :user, :name, :unique_permalink, :url, :price, presence: true
  validates :unique_permalink, uniqueness: true

  before_validation :generate_unique_permalink, on: :create

  private

  def generate_unique_permalink
    loop do
      self.unique_permalink = SecureRandom.hex(10)
      break unless self.class.exists?(unique_permalink: unique_permalink)
    end
  end
end
