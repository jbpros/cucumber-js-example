class CukesController < ApplicationController
  def index
    @features = [ read_feature_source("todos") ]
  end

  def reset_all
    Task.destroy_all
    render :nothing => true
  end

  protected

  def read_feature_source feature_name
    IO.read '../features/' + feature_name + '.feature'
  end
end
