# frozen_string_literal: true

class ProcessLocService < BaseService
  attr_reader :url, :status

  def call(status)
   @status = status
   @url = 'https://www.loc.gov/item/' + status.loc_id + '?fo=json' 
   fetch!
  end

  def fetch!
    #return if @endpoint_url.blank?

    body = Request.new(:get, @url).perform do |res|
      res.code != 200 ? nil : res.body_with_limit
    end

    validate(body) if body.present?
  rescue Oj::ParseError, Ox::ParseError
    nil
  end

  def parse_json(body)
     Oj.load(body, mode: :strict)&.with_indifferent_access
  end

  def validate(json)
  	status.loc_json = json
  	status.save!
  end

end